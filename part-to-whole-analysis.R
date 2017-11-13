library('ggplot2')
library('dplyr')

p2w <- read.csv('part-to-whole-results.csv') %>%
	filter(resultID != '1490192873329x716792') # filter out one participant where logging didn't seem to work right

p2w <- mutate(p2w,
			  error = answer-percentage,
			  absError = abs(error),
			  relAbsError = absError/percentage,
			  relSigError = error/percentage,
			  duration = duration/1000,
			  variation = factor(variation, labels=c("Pie Chart", "Circular", "Circular Straight", "Stacked Bars", "Treemap")),
			  question = factor(question, labels=c("Largest", "Middle"))
)

# Break up values field and pick first and middle one
# Unclear why this isn't working as part of mutate
valuesVector <- strsplit(sapply(p2w$values, as.character), split=",")
largestValue = as.integer(sapply(valuesVector, function(x) x[1]))
middleValue = as.integer(sapply(valuesVector, function(x) x[3]))

p2w <- cbind(p2w, largestValue, middleValue)

p2w <- mutate(p2w,
			  likelyWrongSlice = (question == "Largest" & abs(answer-middleValue) < absError) | (abs(answer-largestValue) < absError)
)

wrongAnswers <- group_by(p2w, variation) %>%
	summarize(count = n(),
			  numWrong = length(variation[likelyWrongSlice]),
			  fractionWrong = numWrong/count)

# Overall percentage of wrong answers
sum(wrongAnswers$numWrong)/sum(wrongAnswers$count)

# Wrong answers by user
wrongUsers <- group_by(p2w, resultID) %>% summarize(count = length(resultID[likelyWrongSlice]))
wrongUsers <- wrongUsers[order(-wrongUsers$count),]

# Users with more than 20 (one third!) wrong answers
filter(wrongUsers, count > 20)

# Filter those out
p2w <- filter(p2w, resultID != '1490138597068x421710' & resultID != '1490192766644x101769' & resultID != '1490137800934x646670' &
			  	resultID != '1490192873362x053807' & resultID != '1490194450478x075984')

p2wbaseline <- p2w %>%
	filter(variation == 'Pie Chart') %>%
	group_by(resultID, question) %>%
	summarize(absErrorBaseline = mean(absError),
			  errorBaseline = mean(error),
			  relAbsErrorBaseline = mean(relAbsError),
			  relSigErrorBaseline = mean(relSigError),
			  durationBaseline = mean(duration))

p2wJoined <- p2w %>%
	left_join(p2wbaseline, by = c('resultID', 'question')) %>%
	mutate(normalizedAbsError = absError/absErrorBaseline,
		   normalizedError = error/errorBaseline,
		   normalizedRelAbsError = relAbsError/relAbsErrorBaseline,
		   normalizedRelSigError = relAbsError/relSigErrorBaseline,
		   normalizedDuration = duration/durationBaseline)

p2wAggregated <- p2wJoined %>%
#	group_by(resultID, variation, question, tail) %>% # for doing RT by tail type below
	group_by(resultID, variation, question) %>%
	summarize(meanError = mean(error), meanAbsError = mean(absError), meanRelAbsError = mean(relAbsError), meanRelSigError = mean(relSigError),
			  meanNormalizedError = mean(normalizedError), meanNormalizedAbsError = mean(normalizedAbsError),
			  meanDuration = mean(duration))

lowerCI <- function(v) {
	mean(v) - sd(v)*1.96/sqrt(length(v))
}

upperCI <- function(v) {
	mean(v) + sd(v)*1.96/sqrt(length(v))
}

largestQs <- function(data) { filter(data, question == 'Largest') }

middleQs <- function(data) { filter(data, question == 'Middle') }

#####
#
# Absolute Error
#
#####

# Absolute error CIs
ggplot(p2wAggregated, aes(x=variation, y=meanAbsError, color=question)) + scale_color_brewer(type="qual", palette="Set1") +
	stat_summary(fun.ymin=lowerCI, fun.ymax=upperCI, geom="errorbar", aes(width=.1)) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend = FALSE) +
#	facet_grid(. ~ question) +
	labs(x = "Variation", y = "Absolute Error") # + ggtitle('Error by slice asked about and variation')

ggsave("/Users/rkosara/Dropbox (Personal)/Papers/2017/InfoVis – Part-Whole/img/p2w-abs-error-question-variation.pdf", width=6, height=4)


ggplot(largestQs(p2wAggregated), aes(x=variation, y=meanAbsError)) +
	stat_summary(fun.ymin=lowerCI, fun.ymax=upperCI, geom="errorbar", aes(width=.1)) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend = FALSE) +
	labs(x = "Variation", y = "Absolute Error") + ggtitle('Error for Largest slice')

# ANOVA for absolute error
summary(aov(meanAbsError ~ variation, p2wAggregated))

# ANOVA for absolute error for largeset slice only
summary(aov(meanAbsError ~ variation, largestQs(p2wAggregated)))

# ANOVA for absolute error for middle slice only
summary(aov(meanAbsError ~ variation, middleQs(p2wAggregated)))

# Paired t-tests for pairwise comparisons of all the types against the pie chart
# Largest slice question
# Bonferroni correction, \alpha = .05/4 = .0125
sapply(tail(levels(p2w$variation), -1), function(testVariation)
		with(largestQs(p2wAggregated), t.test(meanAbsError[variation == 'Pie Chart'], meanAbsError[variation == testVariation], paired=T, alternative = 'less', conf.level=(1-.05/4))))

# Paired t-tests for pairwise comparisons of all the types against the pie chart
# Middle slice question
# Bonferroni correction, \alpha = .05/4 = .0125
sapply(tail(levels(p2w$variation), -1), function(testVariation)
	with(middleQs(p2wAggregated), t.test(meanAbsError[variation == 'Pie Chart'], meanAbsError[variation == testVariation], paired=T, conf.level=(1-.05/4))))


ggplot(largestQs(p2wAggregated), aes(x=variation, y=meanNormalizedAbsError)) +
	stat_summary(fun.ymin=lowerCI, fun.ymax=upperCI, geom="errorbar", aes(width=.1)) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend = FALSE) +
	labs(x = "Variation", y = "Normalized Absolute Error") + ggtitle("Normalized Absolute Error for Largest Slice Question")

ggplot(middleQs(p2wAggregated), aes(x=variation, y=meanNormalizedAbsError)) +
	stat_summary(fun.ymin=lowerCI, fun.ymax=upperCI, geom="errorbar", aes(width=.1)) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend = FALSE) +
	labs(x = "Variation", y = "Normalized Absolute Error") + ggtitle("Normalized Absolute Error for Middle Slice Question")

ggplot(p2wAggregated, aes(x=variation, y=meanNormalizedAbsError)) +
	stat_summary(fun.ymin=lowerCI, fun.ymax=upperCI, geom="errorbar", aes(width=.1)) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend = FALSE) +
	facet_grid(. ~ question) +
	labs(x = "Variation", y = "Normalized Absolute Error") # + ggtitle("Normalized Absolute Error by Variation and Question")


#####
#
# Relative Error
#
#####

# ANOVA for relative error
summary(aov(meanRelAbsError ~ variation, p2wAggregated))

# ANOVA for relative error for largeset slice only
summary(aov(meanRelAbsError ~ variation, largestQs(p2wAggregated)))

# ANOVA for relative error for middle slice only
summary(aov(meanRelAbsError ~ variation, middleQs(p2wAggregated)))

# ANOVA for relative error by question type
summary(aov(meanRelAbsError ~ question, p2wAggregated))


# Paired t-tests for pairwise comparisons of all the types against the pie chart
# Largest slice question
sapply(tail(levels(p2w$variation), -1), function(testVariation)
	with(largestQs(p2wAggregated), t.test(meanRelAbsError[variation == 'Pie Chart'], meanRelAbsError[variation == testVariation], paired=T, alternative = 'less', conf.level=(1-.05/4))))

# Paired t-tests for pairwise comparisons of all the types against the pie chart
# Middle slice question
sapply(tail(levels(p2w$variation), -1), function(testVariation)
	with(middleQs(p2wAggregated), t.test(meanRelAbsError[variation == 'Pie Chart'], meanRelAbsError[variation == testVariation], paired=T, conf.level=(1-.05/4))))


ggplot(p2wAggregated, aes(x=variation, y=meanRelAbsError, color=question)) + scale_color_brewer(type="qual", palette="Set1") +
	stat_summary(fun.ymin=lowerCI, fun.ymax=upperCI, geom="errorbar", aes(width=.1)) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend = FALSE) +
	labs(x = "Variation", y = "Relative Absolute Error")

ggsave("/Users/rkosara/Dropbox (Personal)/Papers/2017/InfoVis – Part-Whole/img/p2w-rel-abs-q-and-variation.pdf", width=6, height=4)

ggplot(p2wAggregated, aes(x=variation, y=meanRelSigError, color=question)) + scale_color_brewer(type="qual", palette="Set1") +
	stat_summary(fun.ymin=lowerCI, fun.ymax=upperCI, geom="errorbar", aes(width=.1)) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend = FALSE) +
	geom_hline(yintercept=0, linetype="dotted") +
	labs(x = "Variation", y = "Relative Signed Error")

ggsave("/Users/rkosara/Dropbox (Personal)/Papers/2017/InfoVis – Part-Whole/img/p2w-rel-sig-q-and-variation.pdf", width=6, height=4)


#####
#
# Signed Error
#
#####
# ANOVA for signed error
summary(aov(meanError ~ variation, p2wAggregated))

# ANOVA for signed error, largest slices only
summary(aov(meanError ~ variation, largestQs(p2wAggregated)))

# ANOVA for signed error, middle slices only
summary(aov(meanError ~ variation, middleQs(p2wAggregated)))

ggplot(p2wAggregated, aes(x=variation, y=meanError, color=question)) + scale_color_brewer(type="qual", palette="Set1") +
	stat_summary(fun.ymin=lowerCI, fun.ymax=upperCI, geom="errorbar", aes(width=.1)) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend = FALSE) +
	geom_hline(yintercept=0, linetype="dotted") +
#	facet_grid(. ~ question) +
	labs(x = "Variation", y = "Signed Error") # + ggtitle('Error by slice asked about and variation')

ggsave("/Users/rkosara/Dropbox (Personal)/Papers/2017/InfoVis – Part-Whole/img/p2w-signed-q-and-variation.pdf", width=6, height=4)


ggplot(p2w, aes(percentage, absError, color=variation)) +
	geom_smooth() +
	facet_grid(question ~ .) +
	labs(x = "Percentage", y = "Absolute Error")

ggplot(p2w, aes(percentage, absError, color=variation)) +
	geom_hline(yintercept=0, linetype="dotted") +
	geom_smooth() +
	facet_grid(question ~ .) +
	labs(x = "Percentage", y = "Signed Error")

ggplot(p2w, aes(x=percentage)) + geom_histogram(binwidth=1)

ggplot(p2w, aes(x=absError, fill=tail)) + geom_histogram(binwidth=1) + facet_grid(question ~ variation)

ggplot(p2w, aes(x=error, fill=tail)) + geom_histogram(binwidth=1) + facet_grid(question ~ variation)


######
#
# By Tail
#
#####

p2wTailbaseline <- p2w %>%
	filter(variation == 'Pie Chart' & question == 'Middle') %>%
	group_by(resultID, tail) %>%
	summarize(absErrorBaseline = mean(absError),
			  errorBaseline = mean(error))

p2wTailJoined <- filter(p2w, question == 'Middle') %>%
	left_join(p2wTailbaseline, by = c('resultID', 'tail')) %>%
	mutate(normalizedAbsError = absError/absErrorBaseline,
		   normalizedError = error/errorBaseline)

p2wTailAggregated <- p2wTailJoined %>%
	group_by(resultID, variation, tail) %>%
	summarize(meanError = mean(error), meanAbsError = mean(absError),
			  meanNormalizedError = mean(normalizedError), meanNormalizedAbsError = mean(normalizedAbsError),
			  meanDuration = mean(duration))

# Absolute error CIs
ggplot(p2wTailAggregated, aes(x=variation, y=meanAbsError, color=tail)) + scale_color_grey(start=0, end=.6) +
	stat_summary(fun.ymin=lowerCI, fun.ymax=upperCI, geom="errorbar", aes(width=.2), position=position_dodge(width=.3)) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend = FALSE, position=position_dodge(width=.3)) +
	labs(x = "Variation", y = "Absolute Error")

ggsave("/Users/rkosara/Dropbox (Personal)/Papers/2017/InfoVis – Part-Whole/img/p2w-abs-tail-and-variation.pdf", width=6, height=4)

# Pairwise paired t-tests of long vs. fat tail for each chart type, Bonferroni-corrected by \alpha/5
sapply(levels(p2w$variation), function(testVariation)
	with(p2wTailAggregated, t.test(meanAbsError[variation == testVariation & tail == 'fat'], meanAbsError[variation == testVariation & tail == 'long'], paired=T, conf.level=(1-.05/5))))

with(p2wTailAggregated, t.test(meanAbsError[tail == 'fat'], meanAbsError[tail == 'long'], paired=T, conf.level=(1-.05/5)))
with(p2wTailAggregated, t.test(meanError[tail == 'fat'], meanError[tail == 'long'], paired=T, conf.level=(1-.05/5)))


# Signed error CIs
ggplot(p2wTailAggregated, aes(x=variation, y=meanError, color=tail)) + scale_color_grey(start=0, end=.6) +
	stat_summary(fun.ymin=lowerCI, fun.ymax=upperCI, geom="errorbar", aes(width=.2), position=position_dodge(width=.3)) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend = FALSE, position=position_dodge(width=.3)) +
	geom_hline(yintercept=0, linetype="dotted") +
	labs(x = "Variation", y = "Signed Error") # + ggtitle('Error by tail type and variation')

ggsave("/Users/rkosara/Dropbox (Personal)/Papers/2017/InfoVis – Part-Whole/img/p2w-signed-tail-and-variation.pdf", width=6, height=4)

# Pairwise paired t-tests of long vs. fat tail for each chart type, Bonferroni-corrected by \alpha/5
sapply(levels(p2w$variation), function(testVariation)
	with(p2wTailAggregated, t.test(meanError[variation == testVariation & tail == 'fat'], meanError[variation == testVariation & tail == 'long'], paired=T, alternative = "less", conf.level=(1-.05/5))))


#
#
# Response Time

ggplot(p2wAggregated, aes(x=variation, y=meanDuration)) +
	stat_summary(fun.ymin=lowerCI, fun.ymax=upperCI, geom="errorbar", aes(width=.1)) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend = FALSE) +
#	facet_grid(. ~ question) +
	labs(x = "Variation", y = "Mean Response Time (s)")

ggsave("/Users/rkosara/Dropbox (Personal)/Papers/2017/InfoVis – Part-Whole/img/p2w-response-time.pdf", width=6, height=4)

with(p2wAggregated, t.test(meanDuration[question == 'Largest'], meanDuration[question == 'Middle'], paired=T))

summary(aov(meanDuration ~ variation, p2wAggregated))

summary(aov(meanDuration ~ variation, largestQs(p2wAggregated)))
summary(aov(meanDuration ~ variation, middleQs(p2wAggregated)))

# Response time by tail type
ggplot(p2wTailAggregated, aes(x=variation, y=meanDuration, color=tail)) + scale_color_grey(start=0, end=.6) +
	stat_summary(fun.ymin=lowerCI, fun.ymax=upperCI, geom="errorbar", aes(width=.2), position=position_dodge(width=.3)) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend = FALSE, position=position_dodge(width=.3)) +
	#	facet_grid(. ~ question) +
	labs(x = "Variation", y = "Mean Response Time (s)")

ggsave("/Users/rkosara/Dropbox (Personal)/Papers/2017/InfoVis – Part-Whole/img/p2w-rt-tail.pdf", width=6, height=4)

with(p2wTailAggregated, t.test(meanDuration[tail == 'long'], meanDuration[tail == 'fat'], paired=T))

mean(p2wTailAggregated$meanDuration[p2wTailAggregated$tail == 'long'])
mean(p2wTailAggregated$meanDuration[p2wTailAggregated$tail == 'fat'])

summary(aov(meanDuration ~ tail, p2wTailAggregated))


p2wRTbaseline <- group_by(p2w, resultID) %>%
	summarize(rtBaseline = mean(duration))

p2wRTJoined <- left_join(p2w, p2wRTbaseline, by = 'resultID') %>%
	mutate(normalizedRT = duration/rtBaseline)

p2wRTAggregated <- p2wRTJoined %>%
	group_by(resultID, variation, question) %>%
	summarize(meanNormalizedRT = mean(normalizedRT))

ggplot(p2wRTAggregated, aes(x=variation, y=meanNormalizedRT)) +
	stat_summary(fun.ymin=lowerCI, fun.ymax=upperCI, geom="errorbar", aes(width=.1)) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend = FALSE) +
	facet_grid(. ~ question) +
	labs(x = "Variation", y = "Normalized Mean Response Time")

with(p2wRTAggregated, t.test(meanNormalizedRT[question == 'Largest'], meanNormalizedRT[question == 'Middle'], paired=T))

summary(aov(meanNormalizedRT ~ variation, largestQs(p2wRTAggregated)))
summary(aov(meanNormalizedRT ~ variation, middleQs(p2wRTAggregated)))

with(middleQs(p2wAggregated), t.test(meanDuration[tail == 'long'], meanDuration[tail == 'fat'], paired=T))


p2wRTTailAggregated <- filter(p2wRTJoined, question == 'Middle') %>%
	group_by(resultID, variation, tail) %>%
	summarize(meanNormalizedRT = mean(normalizedRT))

ggplot(p2wRTTailAggregated, aes(x=variation, y=meanNormalizedRT, color=tail)) + scale_color_grey(start=0, end=.6) +
	stat_summary(fun.ymin=lowerCI, fun.ymax=upperCI, geom="errorbar", aes(width=.2), position=position_dodge(width=.3)) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend = FALSE, position=position_dodge(width=.3)) +
	labs(x = "Variation", y = "Normalized Mean Response Time")

ggsave("/Users/rkosara/Dropbox (Personal)/Papers/2017/InfoVis – Part-Whole/img/p2w-rt-tail-normalized.pdf", width=6, height=4)


with(p2wRTTailAggregated, t.test(meanNormalizedRT[tail == 'long'], meanNormalizedRT[tail == 'fat'], paired=T))

mean(p2wRTTailAggregated$meanNormalizedRT[p2wRTTailAggregated$tail == 'long'])

mean(p2wRTTailAggregated$meanNormalizedRT[p2wRTTailAggregated$tail == 'fat'])

